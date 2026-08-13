module OrganizesAttachments
  extend ActiveSupport::Concern

  class_methods do
    def organizes_attachment(name, folder:)
      after_commit(on: %i[create update]) do
        attached = public_send(name)
        blobs =
          if attached.respond_to?(:each)
            attached.map(&:blob)
          elsif attached.attached?
            [attached.blob]
          else
            []
          end

        blobs.each do |blob|
          next if blob.key.include?("/")

          folder_path = instance_exec(&folder)
          OrganizesAttachments.rekey!(blob, OrganizesAttachments.unique_key(folder_path, blob.filename.to_s))
        end
      end
    end
  end

  def self.unique_key(folder, filename)
    sanitized = ActiveStorage::Filename.new(filename).sanitized
    ext = File.extname(sanitized)
    base = File.basename(sanitized, ext)

    candidate = "#{folder}/#{sanitized}"
    suffix = 2
    while ActiveStorage::Blob.exists?(key: candidate)
      candidate = "#{folder}/#{base}-#{suffix}#{ext}"
      suffix += 1
    end
    candidate
  end

  def self.rekey!(blob, new_key)
    service = blob.service
    content = service.download(blob.key)
    service.upload(new_key, StringIO.new(content), checksum: blob.checksum)
    service.delete(blob.key)
    blob.update!(key: new_key)
  end
end
